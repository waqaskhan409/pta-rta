from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PermitViewSet, PermitDocumentViewSet, PermitTypeViewSet, VehicleTypeViewSet, ChalanViewSet, VehicleFeeStructureViewSet, NotificationViewSet
from .auth_views import AuthViewSet, health_check
from .users_views import UserViewSet, RoleViewSet, FeatureViewSet

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'users', UserViewSet, basename='user')
router.register(r'permits', PermitViewSet)
router.register(r'permit-documents', PermitDocumentViewSet)
router.register(r'permit-types', PermitTypeViewSet, basename='permit-type')
router.register(r'vehicle-types', VehicleTypeViewSet, basename='vehicle-type')
router.register(r'chalans', ChalanViewSet, basename='chalan')
router.register(r'vehicle-fee-structures', VehicleFeeStructureViewSet, basename='vehicle-fee-structure')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'features', FeatureViewSet, basename='feature')

urlpatterns = [
    path('', include(router.urls)),
    path('health/', health_check, name='health-check'),
]
